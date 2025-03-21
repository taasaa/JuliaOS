<<<<<<< HEAD
import { expect } from "chai";
import { ethers } from "hardhat";
import { JuliaMarketplace } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("JuliaMarketplace", function () {
  let marketplace: JuliaMarketplace;
  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let buyer: SignerWithAddress;

  beforeEach(async function () {
    [owner, creator, buyer] = await ethers.getSigners();

    const MarketplaceFactory = await ethers.getContractFactory("JuliaMarketplace");
    marketplace = await MarketplaceFactory.deploy();
=======
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("JuliaMarketplace", function () {
  async function deployMarketplaceFixture() {
    const [owner, seller, buyer] = await ethers.getSigners();
    const Marketplace = await ethers.deployContract("JuliaMarketplace");
    await Marketplace.waitForDeployment();

    return { marketplace: Marketplace, owner, seller, buyer };
  }

  describe("Listing", function () {
    it("should allow users to list items", async function () {
      const { marketplace, seller } = await loadFixture(deployMarketplaceFixture);
      const price = ethers.parseEther("1.0");
      const tx = await marketplace.connect(seller).listItem("Test Item", "Test Description", price);
      const receipt = await tx.wait();

      expect(receipt.status).to.equal(1);
      const item = await marketplace.items(1);
      expect(item.name).to.equal("Test Item");
      expect(item.description).to.equal("Test Description");
      expect(item.price).to.equal(price);
      expect(item.seller).to.equal(seller.address);
      expect(item.isListed).to.equal(true);
    });
>>>>>>> f6fb5f5 (Initial commit: JuliaOS Framework with cross-chain bridge, marketplace, and LLM integration)
  });

  describe("Module Publishing", function () {
    it("Should allow publishing a new module", async function () {
<<<<<<< HEAD
      const moduleName = "Test Module";
      const moduleType = "AI";
      const metadataURI = "ipfs://QmTest";
      const price = ethers.parseEther("1.0");

      await expect(marketplace.connect(creator).publishModule(
        moduleName,
        moduleType,
        metadataURI,
        price
      ))
        .to.emit(marketplace, "ModulePublished")
        .withArgs(1, creator.address, moduleName);

      const module = await marketplace.getModule(1);
      expect(module.name).to.equal(moduleName);
      expect(module.moduleType).to.equal(moduleType);
      expect(module.metadataURI).to.equal(metadataURI);
      expect(module.creator).to.equal(creator.address);
      expect(module.price).to.equal(price);
      expect(module.isActive).to.be.true;
=======
      const { marketplace, seller } = await loadFixture(deployMarketplaceFixture);
      const moduleName = "Test Module";
      const moduleDescription = "Test Description";
      const price = ethers.parseEther("1.0");

      await expect(marketplace.connect(seller).publishModule(
        moduleName,
        moduleDescription,
        price
      ))
        .to.emit(marketplace, "ModulePublished")
        .withArgs(1, seller.address, moduleName, price);

      const module = await marketplace.modules(1);
      expect(module.name).to.equal(moduleName);
      expect(module.description).to.equal(moduleDescription);
      expect(module.publisher).to.equal(seller.address);
      expect(module.price).to.equal(price);
      expect(module.isListed).to.equal(true);
>>>>>>> f6fb5f5 (Initial commit: JuliaOS Framework with cross-chain bridge, marketplace, and LLM integration)
    });
  });

  describe("Module Purchase", function () {
<<<<<<< HEAD
    beforeEach(async function () {
      await marketplace.connect(creator).publishModule(
        "Test Module",
        "AI",
        "ipfs://QmTest",
        ethers.parseEther("1.0")
      );
    });

    it("Should allow purchasing a module", async function () {
      const moduleId = 1;
      const price = ethers.parseEther("1.0");

=======
    it("Should allow purchasing a module", async function () {
      const { marketplace, seller, buyer } = await loadFixture(deployMarketplaceFixture);
      const moduleId = 1;
      const price = ethers.parseEther("1.0");

      await marketplace.connect(seller).publishModule(
        "Test Module",
        "Test Description",
        price
      );

>>>>>>> f6fb5f5 (Initial commit: JuliaOS Framework with cross-chain bridge, marketplace, and LLM integration)
      await expect(marketplace.connect(buyer).purchaseModule(moduleId, {
        value: price
      }))
        .to.emit(marketplace, "ModulePurchased")
<<<<<<< HEAD
        .withArgs(moduleId, buyer.address, 1);

      const license = await marketplace.validateLicense(1, buyer.address);
      expect(license).to.be.true;
    });

    it("Should fail when payment is insufficient", async function () {
      const moduleId = 1;
      const price = ethers.parseEther("0.5");  // Half the required price

      await expect(marketplace.connect(buyer).purchaseModule(moduleId, {
        value: price
=======
        .withArgs(moduleId, buyer.address, seller.address, price);
    });

    it("Should fail when payment is insufficient", async function () {
      const { marketplace, seller, buyer } = await loadFixture(deployMarketplaceFixture);
      const moduleId = 1;
      const price = ethers.parseEther("1.0");
      const insufficientPrice = ethers.parseEther("0.5");

      await marketplace.connect(seller).publishModule(
        "Test Module",
        "Test Description",
        price
      );

      await expect(marketplace.connect(buyer).purchaseModule(moduleId, {
        value: insufficientPrice
>>>>>>> f6fb5f5 (Initial commit: JuliaOS Framework with cross-chain bridge, marketplace, and LLM integration)
      })).to.be.revertedWith("Insufficient payment");
    });
  });

  describe("Platform Fee", function () {
    it("Should allow owner to update platform fee", async function () {
<<<<<<< HEAD
      const newFee = 30;  // 3%
      await expect(marketplace.setPlatformFee(newFee))
=======
      const { marketplace } = await loadFixture(deployMarketplaceFixture);
      const newFee = 30;  // 3%

      await expect(marketplace.updatePlatformFee(newFee))
>>>>>>> f6fb5f5 (Initial commit: JuliaOS Framework with cross-chain bridge, marketplace, and LLM integration)
        .to.emit(marketplace, "PlatformFeeUpdated")
        .withArgs(newFee);

      expect(await marketplace.platformFee()).to.equal(newFee);
    });

    it("Should fail when non-owner tries to update fee", async function () {
<<<<<<< HEAD
      await expect(marketplace.connect(creator).setPlatformFee(30))
        .to.be.revertedWith("Ownable: caller is not the owner");
=======
      const { marketplace, seller } = await loadFixture(deployMarketplaceFixture);
      await expect(marketplace.connect(seller).updatePlatformFee(30))
        .to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount")
        .withArgs(seller.address);
>>>>>>> f6fb5f5 (Initial commit: JuliaOS Framework with cross-chain bridge, marketplace, and LLM integration)
    });
  });
}); 